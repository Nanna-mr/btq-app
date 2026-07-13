import { FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, PlusCircle, Search, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useCategories, useDeleteCategory, useSaveCategory } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import type { Category } from '../types/Product';

export function CategoriesPage() {
  const { t } = useTranslation();
  const { data: categories = [], isLoading } = useCategories();
  const { data: products = [] } = useProducts();
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
  const productCountByCategory = useMemo(() => {
    const counts = new Map<string, number>();

    for (const product of products) {
      counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
    }

    return counts;
  }, [products]);

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
    <div className="categories-page">
      {feedback ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">{feedback}</div> : null}
      {errorMessage ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{errorMessage}</div> : null}
      <Card className="categories-editor-card">
        <form className="categories-editor-form" onSubmit={handleSubmit}>
          <label className="categories-search-field">
            <Search size={22} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Recherche" />
          </label>
          <input id="category-name" className="categories-name-input" value={name} onChange={(event) => setName(event.target.value)} placeholder={t('categoryName')} />
          <button className="categories-add-button" type="submit" disabled={saveCategory.isPending}>
            <PlusCircle size={22} />
            {saveCategory.isPending ? t('loading') : editingCategory ? t('save') : 'Ajouter catégorie'}
          </button>
          {editingCategory ? (
            <Button type="button" variant="ghost" onClick={resetForm}>
              {t('close')}
            </Button>
          ) : null}
        </form>
      </Card>

      <Card className="categories-list-card">
        <h2>{t('categories')}</h2>
        <div className="categories-table-shell">
          <table className="categories-table">
            <thead>
              <tr>
                <th>{t('name')}</th>
                <th>{t('products')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={3}>{t('loading')}</td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={3}>-</td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td>{productCountByCategory.get(category.name) ?? 0}</td>
                    <td>
                      <div className="categories-row-actions">
                        <button className="categories-edit-button" type="button" onClick={() => handleEdit(category)} aria-label={t('edit')}>
                          <Edit size={24} />
                        </button>
                        <button className="categories-delete-button" type="button" onClick={() => handleDelete(category)} aria-label={t('delete')}>
                          <Trash2 size={24} />
                        </button>
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
