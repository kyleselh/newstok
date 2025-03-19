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
NEXT_PUBLIC_NEWS_API_KEY=your_news_api_key_here
```

You can obtain a News API key by signing up at [https://newsapi.org](https://newsapi.org)

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