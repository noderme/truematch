// pages/api/cities.ts
import { NextApiRequest, NextApiResponse } from "next";
import db from "../../lib/db";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const cities = db
      .prepare("SELECT id, name FROM cities ORDER BY name")
      .all();
    res.status(200).json({ cities });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch cities" });
  }
}
