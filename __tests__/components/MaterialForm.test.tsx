import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MaterialForm from '@/components/MaterialForm';
import { MaterialServiceProvider } from '@/core/presentation/di/MaterialServiceProvider';
import type { MaterialService } from '@/core/application/services/MaterialService';

class MockService implements MaterialService {
  calls: any[] = [];
  async createMaterial(input: any): Promise<string> { this.calls.push(['create', input]); return 'm1'; }
  async updateMaterial(uid: string, id: string, data: any): Promise<void> { this.calls.push(['update', uid, id, data]); }
}

describe('MaterialForm', () => {
  it('renders without crashing with DI service', async () => {
    const svc = new MockService();
    const onSaved = jest.fn();
    render(
      <MaterialServiceProvider service={svc as any}>
        <MaterialForm uid="u1" mode="create" onSaved={onSaved} />
      </MaterialServiceProvider>
    );
    expect(screen.getByLabelText('参考書名')).toBeInTheDocument();
  });
});
