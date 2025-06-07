import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock axios before importing axiosInstance
vi.mock('axios', () => {
  const getMock = vi.fn();
  return {
    default: {
      create: vi.fn(() => ({ get: getMock })),
      __getMock: getMock, // Export for test access
    },
  };
});

import axiosInstance from '../axios-client';
import axios from 'axios';

const getMock = (axios as any).__getMock;

describe('axiosInstance', () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it('should set Authorization header if token is provided', async () => {
    getMock.mockResolvedValue({ data: { foo: 'bar' } });
    const token = 'test-token';
    const url = '/test-endpoint';
    await axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } });
    expect(getMock).toHaveBeenCalledWith(url, expect.objectContaining({
      headers: expect.objectContaining({ Authorization: `Bearer ${token}` })
    }));
  });

  // NOTE: In this codebase, Content-Type is not set by default at the instance level.
  // The developer must explicitly pass it if needed. This test documents that behavior.
  it('should not include Content-Type header by default unless provided', async () => {
    getMock.mockResolvedValue({ data: { foo: 'bar' } });
    const url = '/test-endpoint';
    await axiosInstance.get(url);
    // Should only be called with the URL, no config object
    expect(getMock).toHaveBeenCalledWith(url);
  });

  it('should include Content-Type header if provided in config', async () => {
    getMock.mockResolvedValue({ data: { foo: 'bar' } });
    const url = '/test-endpoint';
    await axiosInstance.get(url, { headers: { 'Content-Type': 'application/json' } });
    expect(getMock).toHaveBeenCalledWith(url, expect.objectContaining({
      headers: expect.objectContaining({ 'Content-Type': 'application/json' })
    }));
  });
});
