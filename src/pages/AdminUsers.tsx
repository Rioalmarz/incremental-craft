import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FlowerLogo } from "@/components/FlowerLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowRight, 
  Plus, 
  Trash2, 
  Key, 
  Users as UsersIcon,
  Shield,
  Building2,
  Loader2
} from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  name_ar: string | null;
  center_id: string | null;
  created_at: string;
  user_roles: { role: string }[];
}

const AdminUsers = () => {
  const { user, loading, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState<string | null>(null);
  
  // New user form
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newNameAr, setNewNameAr] = useState("");
  const [newRole, setNewRole] = useState<"superadmin" | "center">("center");
  const [newCenterId, setNewCenterId] = useState("");
  
  // Reset password
  const [resetPassword, setResetPassword] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && !isSuperAdmin) {
      navigate("/");
    }
  }, [user, loading, isSuperAdmin, navigate]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke("manage-users", {
        body: { action: "get_all_users" },
        headers: {
          Authorization: `Bearer ${session.session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setUsers(response.data.users || []);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في جلب المستخدمين",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchUsers();
    }
  }, [isSuperAdmin]);

  const handleCreateUser = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    if (newRole === "center" && !newCenterId.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم المركز الصحي",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke("manage-users", {
        body: {
          action: "create_user",
          username: newUsername.trim(),
          password: newPassword,
          name_ar: newNameAr.trim() || newUsername.trim(),
          role: newRole,
          center_id: newRole === "center" ? newCenterId.trim() : null,
        },
        headers: {
          Authorization: `Bearer ${session.session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: "تم بنجاح",
        description: "تم إنشاء المستخدم بنجاح",
      });

      // Reset form
      setNewUsername("");
      setNewPassword("");
      setNewNameAr("");
      setNewRole("center");
      setNewCenterId("");

      // Refresh users
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء المستخدم",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsDeleting(userId);
    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke("manage-users", {
        body: { action: "delete_user", user_id: userId },
        headers: {
          Authorization: `Bearer ${session.session?.access_token}`,
        },
      });

      if (response.error || response.data.error) {
        throw new Error(response.error?.message || response.data.error);
      }

      toast({
        title: "تم بنجاح",
        description: "تم حذف المستخدم",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف المستخدم",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!resetPassword.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال كلمة المرور الجديدة",
        variant: "destructive",
      });
      return;
    }

    setIsResetting(userId);
    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke("manage-users", {
        body: { 
          action: "update_password", 
          user_id: userId, 
          new_password: resetPassword 
        },
        headers: {
          Authorization: `Bearer ${session.session?.access_token}`,
        },
      });

      if (response.error || response.data.error) {
        throw new Error(response.error?.message || response.data.error);
      }

      toast({
        title: "تم بنجاح",
        description: "تم تحديث كلمة المرور",
      });

      setResetPassword("");
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث كلمة المرور",
        variant: "destructive",
      });
    } finally {
      setIsResetting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background">
        <FlowerLogo animate size={100} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowRight size={20} />
          </Button>
          <div className="flex items-center gap-3">
            <UsersIcon className="text-primary" size={24} />
            <div>
              <h1 className="text-lg font-bold">إدارة المستخدمين</h1>
              <p className="text-xs text-muted-foreground">إضافة وإدارة حسابات النظام</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Add User Card */}
        <Card className="glass mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus size={20} />
              إضافة مستخدم جديد
            </CardTitle>
            <CardDescription>
              أنشئ حساب جديد لمدير نظام أو مركز صحي
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>اسم المستخدم *</Label>
                <Input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="اسم المستخدم للدخول"
                />
              </div>
              <div className="space-y-2">
                <Label>كلمة المرور *</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="كلمة المرور"
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم (عربي)</Label>
                <Input
                  value={newNameAr}
                  onChange={(e) => setNewNameAr(e.target.value)}
                  placeholder="الاسم بالعربي"
                />
              </div>
              <div className="space-y-2">
                <Label>نوع الحساب *</Label>
                <Select value={newRole} onValueChange={(v: "superadmin" | "center") => setNewRole(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="superadmin">مدير نظام</SelectItem>
                    <SelectItem value="center">مركز صحي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newRole === "center" && (
                <div className="space-y-2">
                  <Label>اسم المركز *</Label>
                  <Input
                    value={newCenterId}
                    onChange={(e) => setNewCenterId(e.target.value)}
                    placeholder="اسم المركز الصحي"
                  />
                </div>
              )}
              <div className="flex items-end">
                <Button 
                  onClick={handleCreateUser} 
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <Plus size={18} className="ml-2" />
                      إنشاء الحساب
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>المستخدمون</CardTitle>
            <CardDescription>
              جميع حسابات النظام والمراكز الصحية
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : users.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                لا يوجد مستخدمون حتى الآن
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم المستخدم</TableHead>
                      <TableHead>الاسم</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>المركز</TableHead>
                      <TableHead>تاريخ الإنشاء</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.username}</TableCell>
                        <TableCell>{u.name_ar || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={u.user_roles?.[0]?.role === "superadmin" ? "default" : "secondary"}>
                            {u.user_roles?.[0]?.role === "superadmin" ? (
                              <><Shield size={14} className="ml-1" /> مدير نظام</>
                            ) : (
                              <><Building2 size={14} className="ml-1" /> مركز صحي</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>{u.center_id || "-"}</TableCell>
                        <TableCell>
                          {new Date(u.created_at).toLocaleDateString("ar-SA")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Key size={14} className="ml-1" />
                                  تغيير كلمة المرور
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>تغيير كلمة المرور</DialogTitle>
                                  <DialogDescription>
                                    أدخل كلمة المرور الجديدة للمستخدم {u.username}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <Input
                                    type="password"
                                    placeholder="كلمة المرور الجديدة"
                                    value={resetPassword}
                                    onChange={(e) => setResetPassword(e.target.value)}
                                  />
                                </div>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">إلغاء</Button>
                                  </DialogClose>
                                  <Button 
                                    onClick={() => handleResetPassword(u.user_id)}
                                    disabled={isResetting === u.user_id}
                                  >
                                    {isResetting === u.user_id ? (
                                      <Loader2 className="animate-spin" size={18} />
                                    ) : "حفظ"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 size={14} />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>تأكيد الحذف</DialogTitle>
                                  <DialogDescription>
                                    هل أنت متأكد من حذف المستخدم {u.username}؟
                                    لا يمكن التراجع عن هذا الإجراء.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">إلغاء</Button>
                                  </DialogClose>
                                  <DialogClose asChild>
                                    <Button 
                                      variant="destructive"
                                      onClick={() => handleDeleteUser(u.user_id)}
                                      disabled={isDeleting === u.user_id}
                                    >
                                      {isDeleting === u.user_id ? (
                                        <Loader2 className="animate-spin" size={18} />
                                      ) : "حذف"}
                                    </Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminUsers;
