exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return badRequest("POST only");
  
  const { name, email, phone, organization } = parseJsonBody(event);
  if (!name || !email) return badRequest("name, email required");
  
  const { data, error } = await sb
    .from("offer_letters")
    .insert({
      name,
      email,
      phone: phone || "",
      organization: organization || "",
      status: "pending",
      created_by: auth.profile.id
    })
    .select()
    .single();
  
  if (error) return badRequest(error.message);
  
  // Trigger email (call your offer-letter function)
  await fetch(`${process.env.API_URL || ''}/api/offer-letter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      to: email, 
      name,
      offer_id: data.id 
    })
  });
  
  return ok({ 
    message: "Offer letter queued & email sent", 
    offer_id: data.id 
  });
};
