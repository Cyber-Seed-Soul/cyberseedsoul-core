export default async function fetchStrapiPosts() {
  try {
    // 1. Point to the LIVE AWS Server
    const STRAPI_URL = 'https://cms.cyberseedsoul.in'; 
    
    // Strapi v5 requires 'populate=*' to fetch relations (tags/categories)
    const url = `${STRAPI_URL}/api/articles?populate=*`;
    
    console.log(`📡 Fetching articles from: ${url}`);
    
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Strapi API Error:", res.status, data.error);
      return [];
    }

    if (!data || !data.data || !Array.isArray(data.data)) {
      console.warn("⚠️ No articles found in Strapi.");
      return [];
    }

    console.log(`✅ Successfully fetched ${data.data.length} articles.`);

    return data.data.map((article: any) => {
      // Strapi v5 flattens attributes, but we check both just in case
      const title = article.Title || article.attributes?.Title || 'untitled-post';
      const fallbackSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const finalSlug = article.slug || article.attributes?.slug || fallbackSlug;

      // Extract Tags (Strapi v5 mapping)
      let trueTags: string[] = [];
      const tagsRaw = article.tags || article.attributes?.tags;
      if (tagsRaw) {
        // Handle Strapi v4 vs v5 data structures
        const tagsArray = Array.isArray(tagsRaw) ? tagsRaw : (tagsRaw.data || []);
        tagsArray.forEach((t: any) => {
          const tName = t.Name || t.attributes?.Name;
          if (tName) trueTags.push(tName);
        });
      }

      // Extract Category (Strapi v5 mapping)
      let categoryName = "Uncategorized";
      const catRaw = article.category || article.attributes?.category;
      if (catRaw) {
        // Handle if it's an array or a direct object
        let catObj = Array.isArray(catRaw) ? catRaw[0] : (catRaw.data ? catRaw.data : catRaw);
        if (catObj) {
          categoryName = catObj.Name || catObj.attributes?.Name || "Uncategorized";
        }
      }

      const postDate = new Date(article.publishedAt || article.attributes?.publishedAt || Date.now());
      const content = article.Content || article.attributes?.Content || "";
      const description = article.Description || article.attributes?.Description || "";

      return {
        id: finalSlug, 
        slug: finalSlug, 
        body: content,
        collection: "blog",
        data: {
          title: title,
          pubDatetime: postDate,
          description: description,
          featured: article.Featured || article.attributes?.Featured || false,
          draft: false,
          tags: trueTags.length > 0 ? trueTags : ["others"], 
          category: categoryName, 
        },
      };
    });
  } catch (error) {
    console.error("❌ Fetch crashed:", error);
    return []; 
  }
}