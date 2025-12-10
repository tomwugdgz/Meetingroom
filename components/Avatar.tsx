import React from 'react';
import { Role } from '../types';

interface AvatarProps {
  role: Role;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ role, size = 'md', showBadge = false }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className="relative inline-block">
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0`}>
          {role.avatar.startsWith('http') ? (
              <img src={role.avatar} alt={role.name} className="w-full h-full object-cover" />
          ) : (
              <div className={`w-full h-full flex items-center justify-center text-white font-bold ${role.color || 'bg-gray-500'}`}>
                  {role.avatar}
              </div>
          )}
      </div>
      {showBadge && role.isExpert && (
          <div className="absolute -bottom-1 -right-1 bg-brand-orange text-white text-[10px] px-1.5 py-0.5 rounded-full border border-white font-bold shadow-sm">
            PRO
          </div>
      )}
    </div>
  );
};

export default Avatar;
