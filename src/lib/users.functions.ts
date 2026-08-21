import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ROLES = ["admin", "owner", "finance", "employee"] as const;
type Role = (typeof ROLES)[number];

type CreateUserInput = {
  email: string;
  password: string;
  fullName: string;
  role: Role;
};

function validate(input: CreateUserInput): CreateUserInput {
  const email = String(input?.email ?? "").trim().toLowerCase();
  const password = String(input?.password ?? "");
  const fullName = String(input?.fullName ?? "").trim();
  const role = input?.role;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Email tidak valid");
  if (password.length < 6) throw new Error("Kata sandi minimal 6 karakter");
  if (!ROLES.includes(role)) throw new Error("Level pengguna tidak valid");
  return { email, password, fullName: fullName || email, role };
}

export const createAppUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data, context }) => {
    const { data: rows, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (roleError) throw new Error(roleError.message);
    const privileged = (rows ?? []).some((r) =>
      ["admin", "owner", "finance"].includes(r.role as string),
    );
    if (!privileged) throw new Error("Anda tidak berhak membuat pengguna baru");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Gagal membuat pengguna");

    const userId = created.user.id;
    await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, full_name: data.fullName, email: data.email });
    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: data.role });

    return { id: userId, email: data.email, role: data.role };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; role: Role }) => {
    if (!input?.userId) throw new Error("Pengguna tidak valid");
    if (!ROLES.includes(input.role)) throw new Error("Level pengguna tidak valid");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const privileged = (rows ?? []).some((r) =>
      ["admin", "owner", "finance"].includes(r.role as string),
    );
    if (!privileged) throw new Error("Anda tidak berhak mengubah level pengguna");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const DEMO_USERS = [
  { email: "admin@lavin.app", fullName: "Admin Lavin", role: "admin" as const },
  { email: "owner@lavin.app", fullName: "Owner Lavin", role: "owner" as const },
  { email: "finance@lavin.app", fullName: "Finance Lavin", role: "finance" as const },
  { email: "employee@lavin.app", fullName: "Employee Lavin", role: "employee" as const },
];

/** Membuat empat akun demo tetap. Idempoten dan hanya menyentuh keempat email itu. */
export const seedDemoUsers = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const results: string[] = [];

  const { data: existing } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
  const byEmail = new Map(
    (existing?.users ?? []).map((u) => [String(u.email ?? "").toLowerCase(), u.id]),
  );

  for (const demo of DEMO_USERS) {
    let id = byEmail.get(demo.email);
    if (!id) {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: demo.email,
        password: "123456",
        email_confirm: true,
        user_metadata: { full_name: demo.fullName },
      });
      if (error || !created.user) {
        results.push(`${demo.email}: ${error?.message ?? "gagal"}`);
        continue;
      }
      id = created.user.id;
    }
    await supabaseAdmin
      .from("profiles")
      .upsert({ id, full_name: demo.fullName, email: demo.email });
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: id, role: demo.role }, { onConflict: "user_id,role" });
    results.push(`${demo.email}: ok`);
  }

  return { results };
});
