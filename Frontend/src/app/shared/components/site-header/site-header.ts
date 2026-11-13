
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TuiInput, TuiTextfield } from '@taiga-ui/core';



@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [FormsModule, RouterLink, TuiInput, TuiTextfield],
  templateUrl: './site-header.html',
  styleUrl: './site-header.less'
})
export class SiteHeader {
  @Input() searchTerm = '';
  @Input() wishlistCount = 0;
  @Input() cartCount = 0;
  @Input() isAuthenticated = false;
  @Input() canAccessAdmin = false;
  @Input() canAccessPresupuestos = false;

  @Input() canAccessInventory = false;

  @Output() searchSubmit = new EventEmitter<void>();

  @Output() searchChange = new EventEmitter<string>();
  @Output() wishlistClick = new EventEmitter<void>();
  @Output() cartClick = new EventEmitter<void>();

  // Evento para abrir el panel lateral Mi Perfil
  @Output() profileClick = new EventEmitter<void>();
}
