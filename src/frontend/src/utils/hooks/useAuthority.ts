import { useMemo } from 'react'
import isEmpty from 'lodash/isEmpty'

export default function useAuthority(userAuthority: string[], authority: string[]): boolean {
  // If no specific authority is required, allow access.
  if (!authority || authority.length === 0) {
    return true;
  }
  // Check if at least one required authority exists in userAuthority.
  return authority.some(role => userAuthority.includes(role));
}

