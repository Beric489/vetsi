export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { name, address, postcode } = await req.json();
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    // Search for the place
    const searchQuery = encodeURIComponent(`${name} ${postcode} UK veterinary`);
    const searchRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${searchQuery}&inputtype=textquery&fields=place_id,name,rating,user_ratings_total&key=${apiKey}`
    );
    const searchData = await searchRes.json();

    if (!searchData.candidates?.length) {
      return new Response(JSON.stringify({ found: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const placeId = searchData.candidates[0].place_id;
    const rating = searchData.candidates[0].rating;
    const total = searchData.candidates[0].user_ratings_total;

    // Get reviews
    const detailsRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${apiKey}`
    );
    const detailsData = await detailsRes.json();

    const reviews = (detailsData.result?.reviews || []).map(r => ({
      author: r.author_name,
      avatar: r.profile_photo_url,
      rating: r.rating,
      text: r.text,
      time: r.relative_time_description
    }));

    return new Response(JSON.stringify({ found: true, rating, total, reviews }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ found: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = {
  path: '/api/google-places'
};
