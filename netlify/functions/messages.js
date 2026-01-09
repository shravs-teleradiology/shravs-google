const { ok, badRequest, unauthorized, isOptions, optionsOk, parseJsonBody } = require("./_lib/http");
const { requireUser } = require("./_lib/auth");

exports.handler = async (event) => {
  if (isOptions(event)) return optionsOk();

  const auth = await requireUser(event);
  if (auth.error) return unauthorized(auth.error);

  // GET: ?room_type=common OR ?room_type=dm&dm_room_id=...
  if (event.httpMethod === "GET") {
    const q = event.queryStringParameters || {};
    const room_type = q.room_type || "common";
    const limit = Math.min(parseInt(q.limit || "50", 10), 200);

    let query = auth.sb
      .from("messages")
      .select("id,room_type,dm_room_id,author_id,text,attachment_url,created_at")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (room_type === "common") query = query.eq("room_type", "common");
    else if (room_type === "dm") {
      if (!q.dm_room_id) return badRequest("dm_room_id required for dm");
      query = query.eq("room_type", "dm").eq("dm_room_id", q.dm_room_id);
    } else return badRequest("Invalid room_type");

    const { data, error } = await query;
    if (error) return badRequest(error.message);
    return ok({ messages: data || [] });
  }

  // POST: create message (RLS enforces DM participant-only)
  if (event.httpMethod === "POST") {
    const body = parseJsonBody(event);
    if (!body) return badRequest("Invalid JSON");

    const { room_type, dm_room_id, text, attachment_url } = body;
    if (!room_type || !["common","dm"].includes(room_type)) return badRequest("Invalid room_type");

    const payload = {
      room_type,
      dm_room_id: room_type === "dm" ? (dm_room_id || null) : null,
      author_id: auth.profile.id,
      text: (text || "").trim(),
      attachment_url: attachment_url || null
    };

    if (room_type === "dm" && !payload.dm_room_id) return badRequest("dm_room_id required");
    if (!payload.text && !payload.attachment_url) return badRequest("Message empty");

    const { data, error } = await auth.sb
      .from("messages")
      .insert(payload)
      .select("*")
      .single();

    if (error) return badRequest(error.message);
    return ok({ message: data });
  }

  return badRequest("Unsupported method");
};
