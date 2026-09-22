import {
  Component,
} from '@angular/core';

import {
  RouterOutlet,
} from '@angular/router';

import {
  TuiRoot,
} from '@taiga-ui/core';


@Component({
  selector: 'app-layout',
  standalone: true,

  imports: [
    RouterOutlet,
    TuiRoot,
  ],

  templateUrl: './layout.html',
  styleUrl: './layout.less',
})
export class Layout {}