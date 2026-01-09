const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
};

function json(statusCode, body) {
  return { statusCode, headers: { "Content-Type": "application/json", ...corsHeaders }, body: JSON.stringify(body) };
}

function ok(body){ return json(200, body); }
function badRequest(msg){ return json(400, { error: msg }); }
function unauthorized(msg="Unauthorized"){ return json(401, { error: msg }); }
function forbidden(msg="Forbidden"){ return json(403, { error: msg }); }
function optionsOk(){ return { statusCode: 200, headers: corsHeaders, body: "" }; }
function isOptions(event){ return (event.httpMethod||"").toUpperCase() === "OPTIONS"; }
function parseJsonBody(event){ try { return event.body ? JSON.parse(event.body) : {}; } catch { return null; } }

module.exports = { corsHeaders, json, ok, badRequest, unauthorized, forbidden, isOptions, optionsOk, parseJsonBody };
