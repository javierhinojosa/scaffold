import type { Props as StarlightProps } from '@astrojs/starlight/props';

export interface Props extends StarlightProps {
    entry?: {
        data: {
            title: string;
            description?: string;
            file?: string;
            suggestions?: Array<{
                text: string;
                author?: string;
                date?: string;
            }>;
            [key: string]: any;
        };
    };
} 