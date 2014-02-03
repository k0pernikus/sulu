<?php
/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Sulu\Bundle\TagBundle\Controller;

use FOS\RestBundle\Routing\ClassResourceInterface;
use Sulu\Bundle\TagBundle\Tag\Exception\TagAlreadyExistsException;
use Sulu\Bundle\TagBundle\Tag\Exception\TagNotFoundException;
use Sulu\Component\Rest\Exception\EntityNotFoundException;
use Sulu\Component\Rest\Exception\MissingArgumentException;
use Sulu\Component\Rest\Exception\RestException;
use Sulu\Component\Rest\RestController;
use FOS\RestBundle\Controller\Annotations\Post;

/**
 * Makes tag available through
 * @package Sulu\Bundle\TagBundle\Controller
 */
class TagController extends RestController implements ClassResourceInterface
{
    protected $entityName = 'SuluTagBundle:Tag';

    protected $unsortable = array();

    /**
     * Returns a single tag with the given id
     * @param $id
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function getAction($id)
    {
        $view = $this->responseGetById(
            $id,
            function ($id) {
                return $this->get('sulu_tag.tag_manager')->findById($id);
            }
        );

        return $this->handleView($view);
    }

    /**
     * returns all tags
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function cgetAction()
    {
        if ($this->getRequest()->get('flat') == 'true') {
            // flat structure
            $view = $this->responseList();
        } else {
            $tags = $this->get('sulu_tag.tag_manager')->findAll();
            $view = $this->view($this->createHalResponse($tags), 200);
        }

        return $this->handleView($view);
    }

    /**
     * Inserts a new tag
     * @throws \Doctrine\DBAL\DBALException
     * @throws \Exception
     * @return \Symfony\Component\HttpFoundation\Response
     * @throws \Doctrine\DBAL\DBALException
     * @throws \Exception
     */
    public function postAction()
    {
        $name = $this->getRequest()->get('name');

        try {
            if ($name == null) {
                throw new MissingArgumentException($this->entityName, 'name');
            }

            $tag = $this->get('sulu_tag.tag_manager')->save(array('name' => $name));

            $view = $this->view($tag, 200);
        } catch (TagAlreadyExistsException $exc) {
            $restException = new RestException('The tag with the name "' . $exc->getName() . '" already exists.');
            $view = $this->view($restException->toArray(), 400);
        } catch (RestException $exc) {
            $view = $this->view($exc->toArray(), 400);
        }

        return $this->handleView($view);
    }

    /**
     * Updates the tag with the given ID
     * @param $id
     * @return \Symfony\Component\HttpFoundation\Response
     * @throws \Doctrine\DBAL\DBALException
     * @throws \Exception
     */
    public function putAction($id)
    {
        $name = $this->getRequest()->get('name');

        try {
            if ($name == null) {
                throw new MissingArgumentException($this->entityName, 'name');
            }

            $tag = $this->get('sulu_tag.tag_manager')->save(array('name' => $name), $id);

            $view = $this->view($tag, 200);
        } catch (TagAlreadyExistsException $exc) {
            $restException = new RestException('The tag with the name "' . $name . '" already exists.');
            $view = $this->view($restException->toArray(), 400);
        } catch (TagNotFoundException $exc) {
            $entityNotFoundException = new EntityNotFoundException($this->entityName, $id);
            $view = $this->view($entityNotFoundException->toArray(), 404);
        } catch (RestException $exc) {
            $view = $this->view($exc->toArray(), 400);
        }

        return $this->handleView($view);
    }

    /**
     * Deletes the tag with the given ID
     * @param $id
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function deleteAction($id)
    {
        $delete = function ($id) {
            try {
                $this->get('sulu_tag.tag_manager')->delete($id);
            } catch (TagNotFoundException $tnfe) {
                throw new EntityNotFoundException($this->entityName, $id);
            }
        };

        $view = $this->responseDelete($id, $delete);

        return $this->handleView($view);
    }

    /**
     * POST Route annotation.
     * @Post("/tags/merge")
     */
    public function postMergeAction()
    {
        try {
            $srcTagIds = explode(',', $this->getRequest()->get('src'));
            $destTagId = $this->getRequest()->get('dest');

            $destTag = $this->get('sulu_tag.tag_manager')->merge($srcTagIds, $destTagId);

            $view = $this->view(null, 303, array('location' => $destTag->getLinks()['self']));
        } catch (TagNotFoundException $exc) {
            $entityNotFoundException = new EntityNotFoundException($this->entityName, $exc->getId());
            $view = $this->view($entityNotFoundException->toArray(), 404);
        }

        return $this->handleView($view);
    }
} 
