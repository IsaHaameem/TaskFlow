const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// @desc    Generate a summary for a task using OpenAI
// @route   POST /api/ai/summarize
// @access  Private
exports.summarizeTask = async (req, res) => {
  const { title, description } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    console.error("OpenAI API key is missing. Please check your .env file for OPENAI_API_KEY.");
    return res.status(500).json({ success: false, msg: 'Server configuration error: Missing API Key' });
  }

  if (!title) {
    return res.status(400).json({ success: false, msg: 'Please provide a task title' });
  }

  const prompt = `You are a helpful project management assistant. Summarize the following task in one clear, concise sentence. Be direct and action-oriented. Task Title: "${title}". Description: "${description || 'No description provided.'}"`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using the powerful and cost-effective gpt-4o-mini
      messages: [{ role: "user", content: prompt }],
      max_tokens: 60,
      temperature: 0.5,
    });

    const summary = completion.choices[0].message.content.trim();
    res.status(200).json({ success: true, data: summary });

  } catch (error) {
    console.error('OpenAI API Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, msg: 'Error generating summary from AI' });
  }
};

