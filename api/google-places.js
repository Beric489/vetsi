// api/google-places.js — Vercel serverless function
// Fetches real Google rating and latest reviews for a vet practice
// Set GOOGLE_PLACES_API_KEY in Vercel environment variables

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Google API key not configured' });

  const { name, address, postcode } = req.body;
  if (!name) return res.status(400).json({ error: 'Practice name required' });

  try {
    // Step 1: Find the place using Text Search
    const searchQuery = encodeURIComponent(`${name} veterinary ${postcode || address || ''} UK`);
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${searchQuery}&type=veterinary_care&key=${apiKey}`;

    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.results || searchData.results.length === 0) {
      return res.status(200).json({ found: false });
    }

    const place = searchData.results[0];
    const placeId = place.place_id;

    // Step 2: Get place details including reviews
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${apiKey}`;

    const detailsRes = await fetch(detailsUrl);
    const detailsData = await detailsRes.json();

    if (!detailsData.result) {
      return res.status(200).json({ found: false });
    }

    const result = detailsData.result;

    // Return top 4 most recent reviews
    const reviews = (result.reviews || [])
      .sort((a, b) => b.time - a.time)
      .slice(0, 4)
      .map(r => ({
        author: r.author_name,
        rating: r.rating,
        text: r.text,
        time: r.relative_time_description,
        avatar: r.profile_photo_url || null
      }));

    return res.status(200).json({
      found: true,
      rating: result.rating || null,
      total: result.user_ratings_total || 0,
      reviews
    });

  } catch (err) {
    console.error('Google Places error:', err);
    return res.status(500).json({ error: err.message });
  }
};
