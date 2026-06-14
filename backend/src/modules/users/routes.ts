import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import { db } from "../../db";
import { users, roles, userRoles, NewAppUser } from "../../db/schema";
import { requireRole } from "../../middleware/roles";

const supabaseAdmin = createClient(
  Bun.env.SUPABASE_URL!,
  Bun.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const app = new Hono();

// GET /api/users?includeInactive=true
app.get("/", requireRole("ADMIN"), async (c) => {
  const includeInactive = c.req.query("includeInactive") === "true";

  const rows = includeInactive
    ? await db.select().from(users)
    : await db.select().from(users).where(eq(users.isActive, true));

  return c.json(rows);
});

// GET /api/users/:id
app.get("/:id", requireRole("ADMIN"), async (c) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, c.req.param("id")));

  if (!user) return c.json({ error: "Not found" }, 404);
  return c.json(user);
});

// POST /api/users/provision — crea en Supabase Auth, public.users y asigna rol
app.post("/provision", requireRole("ADMIN"), async (c) => {
  const body = await c.req.json<{ email: string; password: string; name: string; roleName: string; registrationMethod?: string }>();
  const { email, password, name, roleName, registrationMethod = "sysadmin" } = body;

  if (!email || !password || !roleName) {
    return c.json({ error: "email, password y roleName son requeridos" }, 400);
  }

  // Validate registration method
  const allowedRegistrationMethods = ["google", "sysadmin", "web"];
  if (!allowedRegistrationMethods.includes(registrationMethod)) {
    return c.json({ error: "registrationMethod debe ser 'google', 'sysadmin' o 'web'" }, 400);
  }

  // 1. Crear en Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name: name },
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return c.json({ error: authError?.message ?? "Error al crear usuario en Auth" }, 400);
  }

  const newUserId = authData.user.id;

  // 2. Insertar en public.users (ignora si un trigger ya lo hizo)
  await db.insert(users).values({ id: newUserId, email, registrationMethod }).onConflictDoNothing();

  // 3. Buscar rol y asignar
  const [role] = await db.select().from(roles).where(eq(roles.name, roleName));
  if (!role) {
    await supabaseAdmin.auth.admin.deleteUser(newUserId);
    return c.json({ error: `Rol '${roleName}' no encontrado` }, 400);
  }

  await db.insert(userRoles).values({ userId: newUserId, roleId: role.id });

  return c.json({ message: "Usuario creado", userId: newUserId }, 201);
});

// POST /api/users
app.post("/", requireRole("ADMIN"), async (c) => {
  const body = await c.req.json<Pick<NewAppUser, "email">>();

  if (!body.email) return c.json({ error: "email es requerido" }, 400);

  const [created] = await db.insert(users).values({ email: body.email }).returning();
  return c.json(created, 201);
});

// PUT /api/users/:id
app.put("/:id", requireRole("ADMIN"), async (c) => {
  const body = await c.req.json<Partial<Pick<NewAppUser, "email" | "lastLoginAt">>>();

  const [updated] = await db
    .update(users)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(users.id, c.req.param("id")))
    .returning();

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

// DELETE /api/users/:id — eliminación lógica
app.delete("/:id", requireRole("ADMIN"), async (c) => {
  const [deleted] = await db
    .update(users)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(users.id, c.req.param("id")))
    .returning();

  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json({ message: "Usuario desactivado", id: deleted.id });
});

// PATCH /api/users/:id/restore — restaurar eliminación lógica
app.patch("/:id/restore", requireRole("ADMIN"), async (c) => {
  const [restored] = await db
    .update(users)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(users.id, c.req.param("id")))
    .returning();

  if (!restored) return c.json({ error: "Not found" }, 404);
  return c.json({ message: "Usuario restaurado", id: restored.id });
});

export default app;
