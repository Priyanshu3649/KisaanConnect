
"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/page-header";
import { useTranslation } from "@/context/translation-context";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Archive, Droplets, Sprout, Tractor, Package, PackageOpen, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";


type Category = 'Seeds' | 'Fertilizers' | 'Equipment' | 'Other';
interface InventoryItem {
    id: string;
    name: string;
    category: Category;
    quantity: number;
    unit: string;
    lowStockThreshold: number;
    userId: string;
}

const categoryIcons: Record<Category, React.ElementType> = {
    'Seeds': Sprout,
    'Fertilizers': Droplets,
    'Equipment': Tractor,
    'Other': Archive
};

export default function InventoryPage() {
    const { t } = useTranslation();
    const [user] = useAuthState(auth);
    
    const inventoryQuery = user ? query(collection(db, "inventory"), where("userId", "==", user.uid)) : null;
    const [inventory, loading, error] = useCollectionData(inventoryQuery, { idField: 'id' });
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<InventoryItem> | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (error) {
            console.error("Error fetching inventory:", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not fetch inventory data."});
        }
    }, [error, toast]);

    const openDialog = (item: Partial<InventoryItem> | null = null) => {
        setEditingItem(item);
        setIsDialogOpen(true);
    };

    const handleDelete = async (itemId: string) => {
        try {
            await deleteDoc(doc(db, "inventory", itemId));
            toast({ title: t('inventory.itemDeleted'), description: t('inventory.itemDeletedDesc') });
        } catch (e) {
            console.error("Error deleting item:", e);
            toast({ variant: 'destructive', title: "Error", description: "Could not delete item."});
        }
    };

    const handleSave = async (itemData: Partial<InventoryItem>) => {
        if (!user) return;

        try {
            if (itemData.id) {
                // Edit existing item
                const { id, ...dataToUpdate } = itemData;
                await updateDoc(doc(db, "inventory", id), dataToUpdate);
                toast({ title: t('inventory.itemUpdated'), description: `${itemData.name} ${t('inventory.itemUpdatedDesc')}` });
            } else {
                // Add new item
                await addDoc(collection(db, "inventory"), {
                    ...itemData,
                    userId: user.uid,
                    createdAt: serverTimestamp(),
                });
                toast({ title: t('inventory.itemAdded'), description: `${itemData.name} ${t('inventory.itemAddedDesc')}` });
            }
            setIsDialogOpen(false);
            setEditingItem(null);
        } catch(e) {
            console.error("Error saving item:", e);
            toast({ variant: 'destructive', title: "Error", description: "Could not save item."});
        }
    };

    return (
        <>
            <PageHeader
                title={t('nav.inventory')}
                description={t('inventory.pageDescription')}
            >
                <Button onClick={() => openDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t('inventory.addItem')}
                </Button>
            </PageHeader>
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('inventory.itemName')}</TableHead>
                                <TableHead>{t('inventory.category')}</TableHead>
                                <TableHead className="text-right">{t('inventory.quantity')}</TableHead>
                                <TableHead className="text-right">{t('inventory.status')}</TableHead>
                                <TableHead className="text-right">{t('inventory.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-48"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></TableCell>
                                </TableRow>
                            ) : inventory && inventory.length > 0 ? (inventory as InventoryItem[]).map(item => {
                                const isLowStock = item.quantity < item.lowStockThreshold;
                                const Icon = categoryIcons[item.category];
                                return (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Icon className="h-5 w-5 text-muted-foreground" />
                                            {item.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>{t(`inventory.categories.${item.category.toLowerCase()}` as any)}</TableCell>
                                    <TableCell className="text-right">{item.quantity} {item.unit}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={isLowStock ? "destructive" : "default"} className="flex items-center gap-1.5 w-fit ml-auto">
                                            {isLowStock ? <PackageOpen className="h-3 w-3" /> : <Package className="h-3 w-3" />}
                                            {isLowStock ? t('inventory.lowStock') : t('inventory.inStock')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => openDialog(item)}><Edit className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </TableCell>
                                </TableRow>
                            )}) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-48">{t('inventory.noItems')}</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <InventoryFormDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSave={handleSave}
                item={editingItem}
                t={t}
            />
        </>
    );
}

// Dialog Component for Add/Edit
const InventoryFormDialog = ({ isOpen, onOpenChange, onSave, item, t }: { isOpen: boolean; onOpenChange: (open: boolean) => void; onSave: (item: Partial<InventoryItem>) => void; item: Partial<InventoryItem> | null, t: any }) => {
    const [formData, setFormData] = useState<Partial<InventoryItem>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (item) {
                setFormData(item);
            } else {
                setFormData({
                    name: '',
                    category: 'Other',
                    quantity: 0,
                    unit: 'units',
                    lowStockThreshold: 1,
                });
            }
        }
    }, [item, isOpen]);

    const handleChange = (field: keyof Omit<InventoryItem, 'id'|'userId'>, value: string | number) => {
        setFormData(prev => ({...prev, [field]: value}));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{item ? t('inventory.editItem') : t('inventory.addItem')}</DialogTitle>
                    <DialogDescription>{t('inventory.dialogDesc')}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('inventory.itemName')}</Label>
                            <Input id="name" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} placeholder={t('inventory.namePlaceholder')} required/>
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="category">{t('inventory.category')}</Label>
                             <Select value={formData.category || 'Other'} onValueChange={(v: Category) => handleChange('category', v)}>
                                <SelectTrigger id="category">
                                    <SelectValue placeholder={t('inventory.selectCategory')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Seeds">{t('inventory.categories.seeds')}</SelectItem>
                                    <SelectItem value="Fertilizers">{t('inventory.categories.fertilizers')}</SelectItem>
                                    <SelectItem value="Equipment">{t('inventory.categories.equipment')}</SelectItem>
                                    <SelectItem value="Other">{t('inventory.categories.other')}</SelectItem>
                                </SelectContent>
                             </Select>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="quantity">{t('inventory.quantity')}</Label>
                                <Input id="quantity" type="number" value={formData.quantity || ''} onChange={e => handleChange('quantity', parseInt(e.target.value) || 0)} required/>
                             </div>
                             <div className="space-y-2">
                                <Label htmlFor="unit">{t('inventory.unit')}</Label>
                                <Input id="unit" value={formData.unit || ''} onChange={e => handleChange('unit', e.target.value)} placeholder={t('inventory.unitPlaceholder')} required/>
                             </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="lowStockThreshold">{t('inventory.lowStockThreshold')}</Label>
                            <Input id="lowStockThreshold" type="number" value={formData.lowStockThreshold || ''} onChange={e => handleChange('lowStockThreshold', parseInt(e.target.value) || 0)} required/>
                            <p className="text-xs text-muted-foreground">{t('inventory.lowStockDesc')}</p>
                         </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('inventory.saveItem')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
