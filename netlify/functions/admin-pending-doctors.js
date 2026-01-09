export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  const { data, error } = await sb.from("doctor_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ items: data });
}
