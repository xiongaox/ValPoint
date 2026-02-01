/**
 * UserAvatar - 占位组件
 */
import React from 'react';

export default function UserAvatar(props: any) {
    if (props.avatarUrl) {
        return (
            <img
                src={props.avatarUrl}
                alt="Avatar"
                referrerPolicy="no-referrer"
                className={`w-${props.size || 8} h-${props.size || 8} rounded-full object-cover`}
                onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
            />
        );
    }
    // Fallback
    return (
        <div className={`w-${props.size || 8} h-${props.size || 8} bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-gray-300`}>
            {(props.alt || 'U').slice(0, 1).toUpperCase()}
        </div>
    );
}
