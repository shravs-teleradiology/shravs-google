const { ok, badRequest, unauthorized, isOptions, optionsOk, parseJsonBody } = require("./_lib/http");
const { requireUser } = require("./_lib/auth");

function roomKey(a, b) {
  const s = [a, b].sort();
  return `${s[0]}|${s[1]}`;
}

exports.handler = async (event) => {
  if (isOptions(event)) return optionsOk();
  if (event.httpMethod !== "POST") return badRequest("Use POST");

  const auth = await requireUser(event);
  if (auth.error) return unauthorized(auth.error);

  const body = parseJsonBody(event);
  if (!body) return badRequest("Invalid JSON");
  const { peer_id } = body;
  if (!peer_id) return badRequest("peer_id required");
  if (peer_id === auth.profile.id) return badRequest("Cannot DM yourself");

  const key = roomKey(auth.profile.id, peer_id);

  // Try existing
  let { data: existing, error: e1 } = await auth.sb
    .from("dm_rooms")
    .select("id, room_key, user_a, user_b")
    .eq("room_key", key)
    .maybeSingle();

  if (e1) return badRequest(e1.message);
  if (existing) return ok({ room: existing });

  // Create new (RLS requires user is participant)
  const user_a = key.split("|")[0];
  const user_b = key.split("|")[1];

  const { data: created, error: e2 } = await auth.sb
    .from("dm_rooms")
    .insert({ room_key: key, user_a, user_b })
    .select("id, room_key, user_a, user_b")
    .single();

  if (e2) return badRequest(e2.message);

  return ok({ room: created });
};
