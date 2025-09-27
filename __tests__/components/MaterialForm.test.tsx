import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MaterialForm from '@/components/MaterialForm';

describe('MaterialForm', () => {
  it('submits form values through onSubmit callback', async () => {
    const handleSubmit = jest.fn().mockResolvedValue(undefined);

    render(
      <MaterialForm
        onSubmit={handleSubmit}
        initialValues={{
          title: '既定値',
          totalCount: 10,
          dailyPlan: 1,
          startDate: '2025-01-01',
          deadline: '2025-01-10',
          unitType: 'pages',
          subject: 'math',
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText('参考書名'), {
      target: { value: '数学の教科書' },
    });
    expect(screen.getByLabelText('参考書名')).toHaveValue('数学の教科書');

    const totalCountInput = screen.getAllByRole('spinbutton')[0];
    fireEvent.change(totalCountInput, { target: { value: '12' } });

    const submitButton = screen.getByRole('button', { name: '保存' });
    await waitFor(() => expect(submitButton).not.toBeDisabled());

    fireEvent.click(submitButton);

    await waitFor(() => expect(handleSubmit).toHaveBeenCalledTimes(1));
    expect(handleSubmit.mock.calls[0][0]).toMatchObject({
      totalCount: 12,
      unitType: 'pages',
    });
  });
});
