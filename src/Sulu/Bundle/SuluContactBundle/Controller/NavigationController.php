<?php
/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Sulu\Bundle\ContactBundle\Controller;

use Sulu\Bundle\AdminBundle\Admin\ContentNavigation;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Response;


/**
 * Class NavigationController
 * @package Sulu\Bundle\ContactBundle\Controller
 */
class NavigationController extends Controller
{

    const SERVICE_NAME = 'sulu_contact.admin.content_navigation';

    /**
     * returns navigation for contact
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function contactAction()
    {

        // TODO: get type of content (contact / account ...)

        /** @var ContentNavigation $contentNavigation */
        if ($this->has(self::SERVICE_NAME)) {
            $contentNavigation = $this->get(self::SERVICE_NAME);
        }

        return new Response(json_encode($contentNavigation->toArray('contact')));
    }

    /**
     * returns navigation for account
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function accountAction()
    {

        // TODO: get type of content (contact / account ...)

        /** @var ContentNavigation $contentNavigation */
        if ($this->has(self::SERVICE_NAME)) {
            $contentNavigation = $this->get(self::SERVICE_NAME);
        }

        return new Response(json_encode($contentNavigation->toArray('account')));
    }
}
