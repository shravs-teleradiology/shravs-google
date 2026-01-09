export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { name, email, password, organization } = req.body;
  if (!name || !email || !password || !organization) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const { data, error } = await sb.from("doctor_requests").insert({
    name, email, organization
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json({ message: "Request submitted. Wait for admin approval.", request_id: data.id });
}
