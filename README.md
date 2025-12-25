# Shop Assistant Chatbot

A smart chatbot widget that answers customer questions about products using AI.

## Features
- 🤖 AI-powered product assistant
- 📦 Product database with Supabase
- 📊 CSV/Excel import support
- ✏️ Manual product entry
- 🔄 Real-time updates

## Setup

### 1. Get API Keys (FREE)

**OpenRouter (AI Model):**
1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up → Create API key
3. Use FREE models like `nex-agi/deepseek-v3.1-nex-n1:free`

**Supabase (Database):**
1. Go to [supabase.com](https://supabase.com)
2. Create project → Run SQL:

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price TEXT,
  category TEXT,
  stock TEXT DEFAULT 'In Stock',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON products FOR SELECT USING (true);
CREATE POLICY "Public insert" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON products FOR UPDATE USING (true);
CREATE POLICY "Public delete" ON products FOR DELETE USING (true);
```

### 2. Configure

1. Open `admin.html`
2. Enter Supabase URL & Key → Connect
3. Add your products

### 3. Embed in Website

```html
<iframe src="https://YOUR-URL/index.html" 
    style="position:fixed;bottom:20px;right:20px;width:350px;height:450px;border:none;border-radius:16px;z-index:9999;">
</iframe>
```

## Files

| File | Description |
|------|-------------|
| `index.html` | Chatbot widget (embed this) |
| `admin.html` | Admin panel (manage products) |
| `script.js` | Chatbot logic |
| `rag-backend.js` | Product database |
| `style.css` | Styles |
| `products.json` | Sample products |

## License

MIT
