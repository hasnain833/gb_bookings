import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { Booking, Listing, SupportTicket, Notification, Review } from './src/types.js';

const app = express();
const PORT = 3000;

// Temporary empty stores keep API contracts available until database modules land.
// They intentionally contain no demo records.
const listings: Listing[] = [];
const bookings: Booking[] = [];
const reviews: Review[] = [];
const supportTickets: SupportTicket[] = [];
const notifications: Notification[] = [];

// Lazy-loaded Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in server environment. Please configure it in Settings > Secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Body parser
app.use(express.json());

// API: Listings
app.get('/api/listings', (req, res) => {
  const { type, search } = req.query;
  let results = [...listings];

  if (type && typeof type === 'string' && type !== 'offer' && type !== 'all') {
    results = results.filter(l => l.type === type);
  }

  if (search && typeof search === 'string') {
    const term = search.toLowerCase();
    results = results.filter(l => 
      l.title.toLowerCase().includes(term) || 
      l.location.toLowerCase().includes(term) || 
      l.description.toLowerCase().includes(term)
    );
  }

  res.json(results);
});

// API: Single Listing
app.get('/api/listings/:id', (req, res) => {
  const listing = listings.find(l => l.id === req.params.id);
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }
  const listingReviews = reviews.filter(r => r.listingId === req.params.id);
  res.json({ ...listing, reviews: listingReviews });
});

// API: Bookings
app.get('/api/bookings', (req, res) => {
  const { email } = req.query;
  if (email && typeof email === 'string') {
    return res.json(bookings.filter(b => b.customerEmail.toLowerCase() === email.toLowerCase()));
  }
  res.json(bookings);
});

app.post('/api/bookings', (req, res) => {
  const { listingId, customerName, customerEmail, customerPhone, startDate, endDate, totalPrice, paymentMethod, guests, duration, withDriver } = req.body;

  if (!listingId || !customerName || !customerEmail || !startDate || !endDate || !totalPrice || !paymentMethod) {
    return res.status(400).json({ error: 'Missing required booking fields.' });
  }

  const listing = listings.find(l => l.id === listingId);
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  const newBooking: Booking = {
    id: 'b-' + Math.floor(1000 + Math.random() * 9000),
    listingId,
    listingType: listing.type,
    listingTitle: listing.title,
    listingImage: listing.image,
    listingLocation: listing.location,
    customerName,
    customerEmail,
    customerPhone,
    startDate,
    endDate,
    totalPrice,
    status: paymentMethod === 'card' ? 'confirmed' : 'pending',
    paymentStatus: paymentMethod === 'card' ? 'paid' : 'pending',
    paymentMethod,
    createdAt: new Date().toISOString(),
    guests,
    duration,
    withDriver
  };

  bookings.push(newBooking);

  // Auto push notification
  notifications.unshift({
    id: 'n-' + Math.floor(1000 + Math.random() * 9000),
    title: `New Booking ${newBooking.id}`,
    message: `You booked ${listing.title} for PKR ${totalPrice.toLocaleString()}.`,
    type: 'success',
    read: false,
    createdAt: new Date().toISOString()
  });

  res.status(201).json(newBooking);
});

app.put('/api/bookings/:id', (req, res) => {
  const { status, paymentStatus } = req.body;
  const booking = bookings.find(b => b.id === req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  if (status) booking.status = status;
  if (paymentStatus) booking.paymentStatus = paymentStatus;

  // Auto push notification
  notifications.unshift({
    id: 'n-' + Math.floor(1000 + Math.random() * 9000),
    title: `Booking Update`,
    message: `Booking ${booking.id} status is now ${booking.status}.`,
    type: status === 'cancelled' ? 'warning' : 'success',
    read: false,
    createdAt: new Date().toISOString()
  });

  res.json(booking);
});

// API: Review Submission
app.post('/api/reviews', (req, res) => {
  const { listingId, author, rating, comment } = req.body;
  if (!listingId || !author || !rating || !comment) {
    return res.status(400).json({ error: 'Missing review parameters.' });
  }

  const newReview: Review = {
    id: 'r-' + Math.floor(1000 + Math.random() * 9000),
    listingId,
    author,
    rating: Number(rating),
    comment,
    createdAt: new Date().toISOString().split('T')[0]
  };

  reviews.push(newReview);
  res.status(201).json(newReview);
});

// API: Support Tickets
app.get('/api/support/tickets', (req, res) => {
  res.json(supportTickets);
});

app.post('/api/support/tickets', (req, res) => {
  const { subject, category, message } = req.body;
  if (!subject || !category || !message) {
    return res.status(400).json({ error: 'Missing subject, category or message' });
  }

  const newTicket: SupportTicket = {
    id: 'tkt-' + Math.floor(1000 + Math.random() * 9000),
    subject,
    category,
    message,
    status: 'open',
    createdAt: new Date().toISOString(),
    replies: []
  };

  supportTickets.unshift(newTicket);
  res.status(201).json(newTicket);
});

app.post('/api/support/tickets/:id/reply', (req, res) => {
  const { message, sender } = req.body;
  if (!message || !sender) {
    return res.status(400).json({ error: 'Missing reply message or sender' });
  }

  const ticket = supportTickets.find(t => t.id === req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  if (!ticket.replies) ticket.replies = [];
  ticket.replies.push({
    id: 'rep-' + Math.floor(1000 + Math.random() * 9000),
    sender,
    message,
    createdAt: new Date().toISOString()
  });

  res.json(ticket);
});

// API: Notifications
app.get('/api/notifications', (req, res) => {
  res.json(notifications);
});

app.post('/api/notifications/:id/read', (req, res) => {
  const notification = notifications.find(n => n.id === req.params.id);
  if (notification) {
    notification.read = true;
  }
  res.json({ success: true });
});

// API: AI Travel Planner (using server-side Gemini SDK)
app.post('/api/ai-planner', async (req, res) => {
  const { destination, budget, duration, travelers, interests } = req.body;

  if (!destination || !budget || !duration) {
    return res.status(400).json({ error: 'Please provide destination, budget, and duration.' });
  }

  try {
    const ai = getGeminiClient();
    const systemPrompt = `You are "GBBookings AI Companion", an elite luxury travel concierge planner specializing exclusively in northern and urban Pakistan (Gilgit-Baltistan, Hunza, Skardu, Swat, Naran, Margalla Hills, Lahore Heritage).
Your objective is to generate an incredibly detailed, high-end, premium travel itinerary formatted beautifully in pristine markdown. 

Guidelines:
1. Format with elegant headers, bold highlights, and clear tables or bullet points.
2. Structure the response day-by-day.
3. Suggest actual real places, routes, local balti/hunza food items, and premium accommodation/transports.
4. Estimate accurate costs in PKR (Pakistan Rupee) based on the budget tier (Economy, Business, or Elite Luxury).
5. Always start with an elegant personalized greeting and end with a signature: "Your Elite Travel Companion, GBBookings".`;

    const userPrompt = `Generate a customized ${duration}-day travel plan for ${travelers || '1'} traveler(s) to "${destination}" with a total budget of PKR ${budget} (Budget tier). Major interests are: ${interests || 'General sightseeing, nature, local food'}. Add realistic local hotel and transportation recommendations.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    res.json({ itinerary: response.text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate itinerary. Ensure GEMINI_API_KEY is configured in your secrets.',
      details: error.message 
    });
  }
});

// API: Host live message responder (Airbnb feature)
app.post('/api/host/message', async (req, res) => {
  const { listingId, message, chatHistory } = req.body;

  if (!listingId || !message) {
    return res.status(400).json({ error: 'Please provide listingId and message.' });
  }

  const listing = listings.find(l => l.id === listingId);
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found.' });
  }

  try {
    const ai = getGeminiClient();
    const hostName = listing.type === 'car' ? 'Mr. Tariq Shah (Senior Fleet Coordinator)' : 'Karim Balti (Regional Operations Host)';
    const localTip = listing.type === 'hotel' 
      ? 'We guarantee backup central heating, hot water geysers, and traditional local walnut cake upon your arrival.'
      : listing.type === 'car'
        ? 'Our 4x4s are fully serviced and verified for the Babusar Pass and Karakoram Highway roads.'
        : 'All local transfers, professional safety harnesses, and experienced mountain guides are included.';

    const systemPrompt = `You are "${hostName}", the dedicated professional local host and travel partner for "${listing.title}" in "${listing.location}". 
Your properties/services are described as: "${listing.description}".
You represent the elite, warm hospitality of Gilgit-Baltistan and Pakistan.

Rules for responding:
1. Speak directly as the host in first person plural ("We", "Our", "I").
2. Answer the guest's specific query politely, clearly, and helper-mindedly.
3. Be concise (2 to 3 sentences maximum).
4. Always reference some actual aspects of the listing.
5. Remind them of our safety standards (such as: "${localTip}").
6. Keep the tone friendly, warm, and professional. Do not use complex jargon.`;

    const userPrompt = `A guest has sent you this message: "${message}". Please reply to them warmly and answer their query.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    res.json({
      reply: response.text.trim(),
      sender: 'host',
      authorName: hostName,
      createdAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Gemini Host Response Error:', error);
    res.status(503).json({ error: 'Host messaging is currently unavailable.' });
  }
});

// Serve frontend SPA
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
