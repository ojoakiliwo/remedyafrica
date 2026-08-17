import { redirect } from 'next/navigation';

export default function AdminHerbsIndexPage() {
  redirect('/admin/herbs/list');
}
