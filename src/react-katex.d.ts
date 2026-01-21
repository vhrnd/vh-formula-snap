declare module 'react-katex' {
    import { FC } from 'react';

    interface KatexProps {
        math: string;
        errorColor?: string;
        renderError?: (error: { error: Error }) => JSX.Element;
    }

    export const InlineMath: FC<KatexProps>;
    export const BlockMath: FC<KatexProps>;
}
