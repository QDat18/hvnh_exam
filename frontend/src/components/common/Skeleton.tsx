import React from 'react';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    className?: string;
    style?: React.CSSProperties;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
    width = '100%', 
    height = '1rem', 
    borderRadius = '4px',
    className = '',
    style = {}
}) => {
    const skeletonStyle: React.CSSProperties = {
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #f7f7f7 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s infinite linear',
        ...style
    };

    return (
        <>
            <div className={`skeleton-loader ${className}`} style={skeletonStyle} />
            <style>{`
                @keyframes skeleton-shimmer {
                    0% {
                        background-position: 200% 0;
                    }
                    100% {
                        background-position: -200% 0;
                    }
                }
                .skeleton-loader {
                    display: inline-block;
                    vertical-align: middle;
                }
            `}</style>
        </>
    );
};

export default Skeleton;
