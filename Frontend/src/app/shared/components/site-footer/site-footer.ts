
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.less'
})
export class SiteFooter {

  readonly categorias: string[] = [
    'Accesorios para carros',
    'Accesorios para celulares',
    'Accesorios para motos',
    'Apple certificados',
    'Audifonos',
    'Barbería',
    'Cables y cargadores',
    'Cocina',
    'Cornetas',
    'Cámaras wifi y seguridad',
    'Electrónicos',
    'General',
    'Gym',
    'Herramientas',
    'Higiene y belleza',
    'Hogar',
    'Juegos',
    'Juguetes para adultos',
    'Led',
    'Mascotas',
    'Oficina',
    'Para grabar contenido',
    'Perfumes',
    'Pesos',
    'Powerbanks',
    'Routers',
    'Salud',
    'Smart alta gama',
    'Smartwatch',
    'Zona escolar'
  ];

}
