import { useEffect } from "react";
export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    let node = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!node) { node = document.createElement("meta"); node.name = "description"; document.head.appendChild(node); }
    node.content = description;
    const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = title;
    const ogDescription = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    if (ogDescription) ogDescription.content = description;
    const twitterTitle = document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.content = title;
    const twitterDescription = document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]');
    if (twitterDescription) twitterDescription.content = description;
  }, [title, description]);
}
