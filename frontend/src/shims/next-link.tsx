import { forwardRef } from 'react';
import { Link as RouterLink, type LinkProps as RouterLinkProps } from 'react-router-dom';

type NextLinkProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
> &
  Omit<RouterLinkProps, 'to'> & {
    href: string;
  };

const Link = forwardRef<HTMLAnchorElement, NextLinkProps>(
  ({ href, children, replace, state, ...props }, ref) => (
    <RouterLink ref={ref} to={href} replace={replace} state={state} {...props}>
      {children}
    </RouterLink>
  ),
);

Link.displayName = 'Link';

export default Link;
