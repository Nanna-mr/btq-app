import { FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Plus, Search, Tags, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useCategories, useDeleteCategory, useSaveCategory } from '../hooks/useCategories';
import type { Category } from '../types/Product';

export function CategoriesPage() {
  const { t } = useTranslation();
  const { data: categories = [], isLoading } = useCategories();
  const saveCategory = useSaveCategory();
  const deleteCategory = useDeleteCategory();
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [feedback, setFeedback] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.name.toLowerCase().includes(search.trim().toLowerCase())),
    [categories, search],
  );

  const resetForm = () => {
    setName('');
    setEditingCategory(null);
  };

  const showSuccess = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(''), 3000);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage(t('required'));
      return;
    }

    try {
      await saveCategory.mutateAsync({ id: editingCategory?.id, name });
      showSuccess(editingCategory ? t('categoryUpdated') : t('categoryCreated'));
      resetForm();
    } catch {
      setErrorMessage(t('operationFailed'));
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setErrorMessage('');
  };

  const handleDelete = async (category: Category) => {
    if (!window.confirm(t('confirmDeleteCategory'))) {
      return;
    }

    try {
      await deleteCategory.mutateAsync(category.id);
      showSuccess(t('categoryDeleted'));
      if (editingCategory?.id === category.id) {
        resetForm();
      }
    } catch {
      setErrorMessage(t('categoryDeleteBlocked'));
    }
  };

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-semibold text-emerald-800">{t('categoryManagement')}</p>
          <h2 className="text-3xl font-black text-emerald-950">{categories.length} {t('categories').toLowerCase()}</h2>
        </div>
      </div>

      {feedback ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">{feedback}</div> : null}
      {errorMessage ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{errorMessage}</div> : null}

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <Card className="p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-100 text-amber-950">
              <Tags size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">{editingCategory ? t('editCategory') : t('addCategory')}</p>
              <h3 className="text-xl font-black text-emerald-950">{t('categoryName')}</h3>
            </div>
          </div>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <Input label={t('categoryName')} value={name} onChange={(event) => setName(event.target.value)} />
            <div className="flex gap-2">
              <Button type="submit" icon={<Plus size={17} />} disabled={saveCategory.isPending}>
                {saveCategory.isPending ? t('loading') : t('save')}
              </Button>
              {editingCategory ? (
                <Button type="button" variant="ghost" onClick={resetForm}>
                  {t('close')}
                </Button>
              ) : null}
            </div>
          </form>
        </Card>

        <Card className="p-4">
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400 rtl:left-auto rtl:right-3" size={18} />
              <input className="input-control ps-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('search')} />
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('categoryName')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={2}>{t('loading')}</td>
                  </tr>
                ) : (
                  filteredCategories.map((category) => (
                    <tr key={category.id}>
                      <td className="font-bold text-emerald-950">{category.name}</td>
                      <td>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" icon={<Edit size={15} />} onClick={() => handleEdit(category)}>
                            {t('edit')}
                          </Button>
                          <Button size="sm" variant="danger" icon={<Trash2 size={15} />} onClick={() => handleDelete(category)}>
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
    </div>
  );
}
