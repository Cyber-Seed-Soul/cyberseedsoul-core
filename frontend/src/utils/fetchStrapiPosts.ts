export default async function fetchStrapiPosts() {
  try {
    const url = 'http://localhost:1337/api/articles?populate[0]=category&populate[1]=tags';
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      console.error("Strapi API Error:", res.status, data.error);
      return [];
    }

    if (!data || !data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.map((article: any) => {
      const safeTitle = article.Title || article.title || 'untitled-post';
      const fallbackSlug = safeTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const finalSlug = article.Slug || article.slug || fallbackSlug;

      // Extract Tags
      let trueTags: string[] = [];
      const tagsRaw = article.tags || article.Tags;
      if (tagsRaw) {
        const tagsArray = Array.isArray(tagsRaw) ? tagsRaw : (tagsRaw.data || []);
        tagsArray.forEach((t: any) => {
          const tObj = t.attributes || t;
          const tName = tObj.Name || tObj.name || tObj.Slug || tObj.slug;
          if (tName) trueTags.push(tName);
        });
      }

      // Extract Category
      let categoryName = "Uncategorized";
      const catRaw = article.category || article.Category;
      if (catRaw) {
        let catObj = catRaw.attributes ? catRaw.attributes : (catRaw.data ? (catRaw.data.attributes || catRaw.data) : catRaw);
        if (Array.isArray(catObj)) catObj = catObj[0]; 
        
        if (catObj) {
          categoryName = catObj.Name || catObj.name || catObj.Title || catObj.title || "Uncategorized";
        }
      }

      const postDate = new Date(article.publishedAt || article.createdAt || Date.now());

      return {
        id: finalSlug, 
        slug: finalSlug, 
        body: article.Content || article.content || "",
        collection: "blog",
        data: {
          title: safeTitle,
          pubDatetime: postDate,
          description: article.Description || article.description || "",
          featured: article.Featured || article.featured || false,
          draft: false,
          tags: trueTags.length > 0 ? trueTags : ["others"], 
          category: categoryName, 
        },
      };
    });
  } catch (error) {
    console.error("Fetch crashed:", error);
    return []; 
  }
}