import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const research = await getCollection('research');
  return rss({
    title: 'Brutal research',
    description: 'Brutal is a theme for Astro',
    stylesheet: false,
    site: context.site,
    items: research.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/research/${post.slug}/`,
    })),
    customData: '<language>en-us</language>',
    canonicalUrl: 'https://brutal.elian.codes',
  });
}
