/**
 * Centralized API Response Normalizer
 * 
 * Ensures consistent data ingestion by unwrapping standardized backend envelopes 
 * while maintaining role-awareness for specific operational contexts.
 */
export const normalizeResponse = (data: any) => {
  if (!data) return null;

  // 1. ROLE PROTECTION (LOCKED)
  // If response contains both role and payload, preserve the full object.
  // This is required for role-aware filtering in pages like Tasks.tsx.
  if (data.role && data.payload !== undefined) {
    return data;
  }

  // 2. PAYLOAD UNWRAPPING
  // Extract primary content from the 'payload' field if standalone.
  if (data.payload !== undefined) {
    return data.payload;
  }

  // 3. ENVELOPE UNWRAPPING (SAFE)
  // Only unwrap 'data' if it appears to be a backend-injected envelope.
  // If the object has multiple significant fields, keep it intact.
  if (data.data !== undefined) {
    const keys = Object.keys(data).filter(k => k !== 'data' && k !== 'success' && k !== 'message');
    if (keys.length === 0) {
      return data.data;
    }
  }

  // 4. GUARD & FALLBACK
  // Log unexpected shapes for debugging, but do not mutate for safety.
  if (typeof data === 'object' && !Array.isArray(data)) {
    // Detect valid shapes explicitly to avoid noise
    const isSuccessEnvelope = data.success !== undefined && data.data !== undefined;
    const isRolePayloadShape = data.role && data.payload !== undefined;
    const isPayloadOnlyShape = data.payload !== undefined;
    
    // If it's a known valid structure, we're done (no warning)
    if (isSuccessEnvelope || isRolePayloadShape || isPayloadOnlyShape) {
      return data;
    }

    const keys = Object.keys(data);
    const commonKeys = ['success', 'message', 'errors'];
    
    // Check if the object has any keys other than the standard success/message ones.
    // If it does, and it hasn't matched a known pattern above, it's an "unrecognized" shape.
    const hasOperationalData = keys.some(k => !commonKeys.includes(k));
    
    if (hasOperationalData) {
      console.warn("[API] Unrecognized response shape detected:", data);
    }
  }

  return data;
};
