const { ok, badRequest, unauthorized, forbidden, isOptions, optionsOk, parseJsonBody } = require("./_lib/http");
const { requireUser, requireAdmin } = require("./_lib/auth");

exports.handler = async (event) => {
  if (isOptions(event)) return optionsOk();

  const auth = await requireUser(event);
  if (auth.error) return unauthorized(auth.error);

  // GET: list tasks (RLS filters rows securely)
  if (event.httpMethod === "GET") {
    const { data, error } = await auth.sb
      .from("tasks")
      .select("id,title,description,priority,due_date,status,assigned_to,created_by,created_at")
      .order("created_at", { ascending: false });

    if (error) return badRequest(error.message);
    return ok({ tasks: data || [] });
  }

  // POST: admin assigns a task
  if (event.httpMethod === "POST") {
    if (!requireAdmin(auth.profile)) return forbidden("Admin only");

    const body = parseJsonBody(event);
    if (!body) return badRequest("Invalid JSON");

    const { title, description, priority, due_date, assigned_to } = body;
    if (!title || !assigned_to) return badRequest("title and assigned_to required");

    const { data, error } = await auth.sb
      .from("tasks")
      .insert({
        title,
        description: description || "",
        priority: priority || "medium",
        due_date: due_date || null,
        assigned_to,
        created_by: auth.profile.id
      })
      .select("*")
      .single();

    if (error) return badRequest(error.message);
    return ok({ task: data });
  }

  // PATCH: assignee marks done/pending (RLS enforces assignee/admin)
  if (event.httpMethod === "PATCH") {
    const body = parseJsonBody(event);
    if (!body) return badRequest("Invalid JSON");
    const { id, status } = body;
    if (!id || !status) return badRequest("id and status required");
    if (!["pending","done"].includes(status)) return badRequest("Invalid status");

    const { data, error } = await auth.sb
      .from("tasks")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    if (error) return badRequest(error.message);
    return ok({ task: data });
  }

  return badRequest("Unsupported method");
};
