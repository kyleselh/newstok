# Newstok

A modern web application that combines international news tracking functionality, providing a curated feed of news from various global sources. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Real-time international news tracking
- Region-based news categorization
- Smooth vertical scrolling news interface
- Responsive design with modern UI
- News source filtering by region
- Dark mode support

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Axios for API requests
- News API integration

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
```

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
NEWS_API_KEY=your_news_api_key_here
UPSTASH_REDIS_URL=your_redis_url_here
UPSTASH_REDIS_TOKEN=your_redis_token_here
```

You can obtain a News API key by signing up at [https://newsapi.org](https://newsapi.org)
For Redis functionality, sign up at [Upstash](https://upstash.com) for a Redis database.

Then, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## News Sources

The application aggregates news from various international sources across different regions:

- **Europe**: BBC, The Guardian, DW, Euronews, France24, Irish Times, and more
- **Asia**: SCMP, Japan Times, Straits Times, Al Jazeera, Channel News Asia, and more
- **Africa**: News24, African News, Nation Africa, and more
- **Latin America**: MercoPress, Buenos Aires Times, Brazil News
- **Oceania**: ABC Australia, NZ Herald, Stuff NZ

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Security Features

This application includes several security measures:

- **Rate Limiting**: Prevents abuse through IP-based request throttling
- **Input Validation**: All inputs are validated using Zod schemas
- **Content Sanitization**: Prevents XSS attacks by sanitizing all external content
- **HTTP Security Headers**: Implements best practices for security headers
- **CORS Protection**: Restricts access to the API from unauthorized origins
- **Environment Variable Validation**: Checks required variables are set at startup
- **Error Handling**: Prevents leaking of sensitive information in error messages
- **Deployment Scripts**: Includes security checks before deployment

### Security Deployment Checklist

Before deploying to production:

1. Run the security audit: `npm run security-audit`
2. Ensure all environment variables are set correctly
3. Never commit .env files to your repository
4. Use the deployment scripts in the `/scripts` directory
5. Consider running a penetration test before public release