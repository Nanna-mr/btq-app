import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useDeleteUser, useUpdateUserStatus, useUsers } from '../hooks/useUsers';
import { useAuthStore } from '../stores/authStore';

export function UsersPage() {
  const { t } = useTranslation();
  const currentUser = useAuthStore((state) => state.user);
  const { data: users = [], isLoading, isError } = useUsers();
  const updateStatus = useUpdateUserStatus();
  const deleteUser = useDeleteUser();
  const [feedback, setFeedback] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleDelete = async (userId: string) => {
    setFeedback('');
    setErrorMessage('');

    if (currentUser?.id === userId) {
      return;
    }

    if (!window.confirm(t('confirmDeleteUser'))) {
      return;
    }

    try {
      await deleteUser.mutateAsync(userId);
      setFeedback(t('userDeleted'));
    } catch (error) {
      console.error('Delete user failed', error);
      const message = typeof error === 'object' && error && 'message' in error ? String(error.message) : error instanceof Error ? error.message : t('deleteUserFailed');
      setErrorMessage(message || t('deleteUserFailed'));
    }
  };

  return (
    <div className="erp-page grid gap-5">
      {isError ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{t('usersLoadError')}</div> : null}
      {feedback ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">{feedback}</div> : null}
      {errorMessage ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{errorMessage}</div> : null}
      <Card className="p-4">
        <h2 className="mb-4 text-2xl font-black text-emerald-950">{t('users')}</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>{t('name')}</th><th>{t('email')}</th><th>{t('role')}</th><th>{t('status')}</th><th>{t('actions')}</th></tr></thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5}>{t('loading')}</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td><Badge>{t(user.role === 'gerant' ? 'manager' : 'seller')}</Badge></td>
                    <td><Badge tone={user.isActive ? 'green' : 'red'}>{user.isActive ? t('active') : t('inactive')}</Badge></td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant={user.isActive ? 'danger' : 'secondary'} onClick={() => updateStatus.mutate({ id: user.id, isActive: !user.isActive })} disabled={updateStatus.isPending}>
                        {user.isActive ? t('deactivate') : t('activate')}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(user.id)} disabled={deleteUser.isPending || currentUser?.id === user.id}>
                        {t('delete')}
                      </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
