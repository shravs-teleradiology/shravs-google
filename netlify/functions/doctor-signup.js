exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return badRequest("POST only");
  
  const { name, email, organization } = parseJsonBody(event);
  
  if (!name || !email || !organization) return badRequest("Missing fields");
  
  const { data, error } = await sb
    .from("doctor_requests")
    .insert({
      name, 
      email, 
      organization,
      status: "pending"  // ← ADD THIS LINE
    })
    .select()
    .single();
  
  if (error) return badRequest(error.message);
  
  return ok({ 
    message: "Request submitted. Wait for admin approval.", 
    request_id: data.id 
  });
};
