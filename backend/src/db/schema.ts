import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  registrationMethod: text("registration_method").notNull().default("web"),
});

export type AppUser = typeof users.$inferSelect;
export type NewAppUser = typeof users.$inferInsert;

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
});

export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  roleId: uuid("role_id")
    .notNull()
    .references(() => roles.id),
  assignedAt: timestamp("assigned_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
});

export const educationalContent = pgTable("educational_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  contentType: text("content_type").notNull(),
  body: text("body").notNull(),
  imageUrl: text("image_url"),
  wasteTypeId: uuid("waste_type_id"),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export type EducationalContent = typeof educationalContent.$inferSelect;
export type NewEducationalContent = typeof educationalContent.$inferInsert;

export const funFacts = pgTable("fun_facts", {
  id: uuid("id").primaryKey().defaultRandom(),
  text: text("text").notNull(),
  wasteTypeId: uuid("waste_type_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export type FunFact = typeof funFacts.$inferSelect;
export type NewFunFact = typeof funFacts.$inferInsert;

export const wasteTypes = pgTable("waste_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export type WasteType = typeof wasteTypes.$inferSelect;
export type NewWasteType = typeof wasteTypes.$inferInsert;

export const instructions = pgTable("instructions", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  body: text("body"),
  imageUrl: text("image_url"),
  wasteTypeId: uuid("waste_type_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});
export type Instruction = typeof instructions.$inferSelect;
export type NewInstruction = typeof instructions.$inferInsert;

export const instructionSteps = pgTable("instruction_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  instructionId: uuid("instruction_id").notNull().references(() => instructions.id),
  text: text("text").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});
export type InstructionStep = typeof instructionSteps.$inferSelect;
export type NewInstructionStep = typeof instructionSteps.$inferInsert;
