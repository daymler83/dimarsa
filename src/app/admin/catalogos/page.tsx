import Link from "next/link";

import { getCatalogsWithCounts } from "@/actions/catalogs";
import { CreateCatalogDialog } from "@/components/admin/create-catalog-dialog";
import { DeleteCatalogButton } from "@/components/admin/delete-catalog-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";

export default async function AdminCatalogsPage() {
  const [catalogs, categories, products] = await Promise.all([
    getCatalogsWithCounts(),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({
      where: { active: true },
      select: { id: true, name: true, categoryId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-navy">Catálogos</h1>
            <p className="text-sm text-muted-foreground">
              Agrupa categorías completas y productos sueltos para que tus vendedores
              compartan recortes del catálogo.
            </p>
          </div>
          <CreateCatalogDialog categories={categories} products={products} />
        </div>

        <Card className="border-white/70 bg-white/95 shadow-brand">
          <CardHeader>
            <CardTitle className="text-navy">{catalogs.length} catálogos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {catalogs.map((catalog) => (
                  <TableRow key={catalog.id}>
                    <TableCell className="font-medium text-navy">{catalog.name}</TableCell>
                    <TableCell className="text-muted-foreground">{catalog.slug}</TableCell>
                    <TableCell>{catalog.productCount}</TableCell>
                    <TableCell>
                      <Badge className={catalog.isActive ? "bg-success text-white" : "bg-muted text-muted-foreground"}>
                        {catalog.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex justify-end gap-2 text-right">
                      <Link
                        href={`/admin/catalogos/${catalog.id}`}
                        className="inline-flex h-9 items-center rounded-full border border-navy/20 px-3 text-sm font-medium text-navy transition-colors hover:bg-cream"
                      >
                        Editar
                      </Link>
                      <DeleteCatalogButton catalogId={catalog.id} catalogName={catalog.name} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
