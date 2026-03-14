import { Card, CardContent } from '@/components/ui/card';
import { Clock, CheckCircle, XCircle, Archive, TrendingUp, Users, Percent } from 'lucide-react';

interface StatsProps {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

const DashboardStats = ({ pending, approved, rejected, total }: StatsProps) => {
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
  const reviewedCount = approved + rejected;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
      <Card variant="glass">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card variant="glass">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{approved}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card variant="glass">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{rejected}</p>
              <p className="text-xs text-muted-foreground">Rejected</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card variant="glass">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Archive className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{reviewedCount}</p>
              <p className="text-xs text-muted-foreground">Reviewed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <Percent className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{approvalRate}%</p>
              <p className="text-xs text-muted-foreground">Approval Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
