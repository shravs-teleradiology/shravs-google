const { ok, unauthorized, isOptions, optionsOk } = require("./_lib/http");
const { requireUser } = require("./_lib/auth");

exports.handler = async (event) => {
  if (isOptions(event)) return optionsOk();
  if (event.httpMethod !== "GET") return { statusCode: 405, body: "Method Not Allowed" };

  const auth = await requireUser(event);
  if (auth.error) return unauthorized(auth.error);

  return ok({ profile: auth.profile });
};
