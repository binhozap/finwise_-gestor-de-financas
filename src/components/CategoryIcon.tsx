import React from 'react';
import * as Icons from 'lucide-react';

export const ICONS_MAP = Icons;

interface CategoryIconProps extends React.SVGProps<SVGSVGElement> {
  name?: string;
  size?: string | number;
  strokeWidth?: string | number;
  className?: string;
}

export default function CategoryIcon({ name, ...props }: CategoryIconProps) {
  const isEmoji = name && /\p{Extended_Pictographic}/u.test(name);
  
  if (isEmoji) {
    return (
      <span 
        style={{ fontSize: typeof props.size === 'number' ? `${props.size}px` : props.size }}
        className={props.className}
      >
        {name}
      </span>
    );
  }

  if (name && name.startsWith('data:image')) {
    return (
      <img 
        src={name} 
        alt="Categoria"
        style={{ width: props.size, height: props.size }}
        className={`object-cover rounded-md ${props.className || ''}`}
      />
    );
  }

  const Icon = (name && (Icons as any)[name]) || Icons.Tag;
  return <Icon {...props} />;
}
