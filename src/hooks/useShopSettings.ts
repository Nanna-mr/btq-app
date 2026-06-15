import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const SETTINGS_ID = 'default';
const BUCKET = 'boutique';

export interface ShopSettings {
  shopName: string;
  logoUrl: string;
  phone: string;
  address: string;
  footerMessage: string;
}

interface SettingsRow {
  shop_name: string | null;
  logo_url: string | null;
  phone: string | null;
  address: string | null;
  footer_message: string | null;
}

export const defaultShopSettings: ShopSettings = {
  shopName: '1ere Commerce',
  logoUrl: '',
  phone: '',
  address: '',
  footerMessage: 'Thank you for shopping with us',
};

function mapSettings(row: SettingsRow | null): ShopSettings {
  return {
    shopName: row?.shop_name || defaultShopSettings.shopName,
    logoUrl: row?.logo_url || '',
    phone: row?.phone || '',
    address: row?.address || '',
    footerMessage: row?.footer_message || defaultShopSettings.footerMessage,
  };
}

export function useShopSettings() {
  return useQuery<ShopSettings>({
    queryKey: ['shopSettings'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return defaultShopSettings;
      }

      const { data, error } = await supabase
        .from('app_settings')
        .select('shop_name,logo_url,phone,address,footer_message')
        .eq('id', SETTINGS_ID)
        .maybeSingle<SettingsRow>();

      if (error) {
        throw error;
      }

      return mapSettings(data);
    },
  });
}

export function useSaveShopSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: ShopSettings) => {
      if (!isSupabaseConfigured) {
        throw { code: 'supabase_not_configured', message: 'Supabase is not configured' };
      }

      const { error } = await supabase.from('app_settings').upsert({
        id: SETTINGS_ID,
        shop_name: settings.shopName,
        logo_url: settings.logoUrl || null,
        phone: settings.phone || null,
        address: settings.address || null,
        footer_message: settings.footerMessage || defaultShopSettings.footerMessage,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['shopSettings'] });
    },
  });
}

export function useUploadShopLogo() {
  return useMutation({
    mutationFn: async (file: File) => {
      if (!isSupabaseConfigured) {
        throw { code: 'supabase_not_configured', message: 'Supabase is not configured' };
      }

      const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
      const filePath = `settings/logo-${Date.now()}.${extension}`;
      const { error } = await supabase.storage.from(BUCKET).upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

      if (error) {
        throw error;
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      return data.publicUrl;
    },
  });
}
