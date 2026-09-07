import React, { useEffect } from 'react';
import { generateOpenGraphMetadata, normalizeShareableContent } from '../../services/socialSharingService';

/**
 * SocialMetaTags
 * Updates document title, canonical link, Open Graph and Twitter Card meta tags
 * dynamically on route and content changes.
 */
export default function SocialMetaTags({
  contentType,
  data,
  user,
}) {
  useEffect(() => {
    if (!data) return;

    try {
      const normalized = normalizeShareableContent({
        type: contentType,
        data,
        user,
      });

      const meta = generateOpenGraphMetadata(normalized);

      // 1. Update Title
      document.title = meta.title;

      // 2. Helper to set or create meta tag
      const setMeta = (attrName, attrVal, content) => {
        if (!content) return;
        let el = document.querySelector(`meta[${attrName}="${attrVal}"]`);
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute(attrName, attrVal);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      };

      // Open Graph Tags
      setMeta('property', 'og:title', meta.title);
      setMeta('property', 'og:description', meta.description);
      setMeta('property', 'og:image', meta.image);
      setMeta('property', 'og:url', meta.url);
      setMeta('property', 'og:type', meta.type);
      setMeta('property', 'og:site_name', meta.siteName);

      // Twitter Cards
      setMeta('name', 'twitter:card', meta.twitterCard);
      setMeta('name', 'twitter:title', meta.twitterTitle);
      setMeta('name', 'twitter:description', meta.twitterDescription);
      setMeta('name', 'twitter:image', meta.twitterImage);

      // Canonical link tag
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', meta.url);
    } catch (e) {
      console.warn('Could not update SocialMetaTags:', e);
    }
  }, [contentType, data, user]);

  return null;
}
