import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import TourForm from '../components/TourForm';

export default function NewTourPage() {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/admin/tours" className="hover:text-foreground transition-colors flex items-center gap-1">
          <Icon name="MapIcon" size={14} />
          Tours
        </Link>
        <Icon name="ChevronRightIcon" size={14} />
        <span className="text-foreground font-medium">New Tour</span>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Add New Tour</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Fill in the details to create a new tour listing.</p>
      </div>

      <TourForm />
    </div>
  );
}
