import type { Props as StarlightProps } from '@astrojs/starlight/props';

export interface Props extends StarlightProps {
  entry?: {
    collection: string;
    slug: string;
    data: {
      title: string;
      description?: string;
      frontmatter?: {
        suggestions?: Array<{
          text: string;
          author?: string;
          date?: string;
        }>;
        [key: string]: any;
      };
      suggestions?: Array<{
        text: string;
        author?: string;
        date?: string;
      }>;
      [key: string]: any;
    };
    render: () => Promise<{
      Content: any;
      headings: any[];
      remarkPluginFrontmatter: {
        title: string;
        description?: string;
        suggestions?: Array<{
          text: string;
          author?: string;
          date?: string;
        }>;
        [key: string]: any;
      };
    }>;
  };
}
